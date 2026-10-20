// On-device background removal with Apple Vision (macOS 14+), no model download.
// Usage: swift scripts/assets/cutout.swift <input-image> <output.png> [--all|--largest]
//   --largest (default): keep only the biggest foreground instance (one object per cut-out)
//   --all: keep every detected instance (a group of objects, a person holding something)
import AppKit
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: cutout.swift <input> <output.png> [--all|--largest]\n".data(using: .utf8)!)
    exit(2)
}
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let keepAll = args.contains("--all")

guard let ciImage = CIImage(contentsOf: inURL, options: [.applyOrientationProperty: true]) else {
    FileHandle.standardError.write("cannot read \(inURL.path)\n".data(using: .utf8)!)
    exit(1)
}

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
do {
    try handler.perform([request])
} catch {
    FileHandle.standardError.write("vision failed: \(error)\n".data(using: .utf8)!)
    exit(1)
}
guard let result = request.results?.first, !result.allInstances.isEmpty else {
    FileHandle.standardError.write("no foreground subject found\n".data(using: .utf8)!)
    exit(3)
}

var instances = result.allInstances
if !keepAll && instances.count > 1 {
    // Pick the instance with the largest mask area.
    var best = instances.first!
    var bestArea = -1
    for idx in instances {
        if let mask = try? result.generateScaledMaskForImage(forInstances: IndexSet(integer: idx), from: handler) {
            CVPixelBufferLockBaseAddress(mask, .readOnly)
            let w = CVPixelBufferGetWidth(mask), h = CVPixelBufferGetHeight(mask)
            let stride = CVPixelBufferGetBytesPerRow(mask) / MemoryLayout<Float32>.size
            let base = CVPixelBufferGetBaseAddress(mask)!.assumingMemoryBound(to: Float32.self)
            var area = 0
            for y in Swift.stride(from: 0, to: h, by: 4) {
                for x in Swift.stride(from: 0, to: w, by: 4) where base[y * stride + x] > 0.5 { area += 1 }
            }
            CVPixelBufferUnlockBaseAddress(mask, .readOnly)
            if area > bestArea { bestArea = area; best = idx }
        }
    }
    instances = IndexSet(integer: best)
}

do {
    let masked = try result.generateMaskedImage(ofInstances: instances, from: handler, croppedToInstancesExtent: true)
    let out = CIImage(cvPixelBuffer: masked)
    let ctx = CIContext()
    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
    try ctx.writePNGRepresentation(of: out, to: outURL, format: .RGBA8, colorSpace: colorSpace)
    print("ok \(outURL.path) instances=\(instances.count) of \(result.allInstances.count) size=\(Int(out.extent.width))x\(Int(out.extent.height))")
} catch {
    FileHandle.standardError.write("mask export failed: \(error)\n".data(using: .utf8)!)
    exit(1)
}

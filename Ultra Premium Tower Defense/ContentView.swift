//
//  ContentView.swift
//  Ultra Premium Tower Defense
//
//  Created by James Alford on 8/3/25.
//

import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        GameWebView()
            #if os(iOS)
            .ignoresSafeArea()
            #else
            .frame(minWidth: 800, minHeight: 600)
            #endif
    }
}

#if os(iOS)
struct GameWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let preferences = WKPreferences()
        preferences.javaScriptEnabled = true
        
        let configuration = WKWebViewConfiguration()
        configuration.preferences = preferences
        configuration.allowsInlineMediaPlayback = true
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        
        // Load HTML content as string
        if let htmlPath = Bundle.main.path(forResource: "game", ofType: "html"),
           let htmlContent = try? String(contentsOfFile: htmlPath) {
            webView.loadHTMLString(htmlContent, baseURL: Bundle.main.bundleURL)
        } else {
            // Fallback: Load from file system during development
            let projectPath = "/Users/jamesalford/Documents/Ultra Premium Tower Defense/Ultra Premium Tower Defense/game.html"
            if let htmlContent = try? String(contentsOfFile: projectPath) {
                webView.loadHTMLString(htmlContent, baseURL: URL(fileURLWithPath: projectPath).deletingLastPathComponent())
            }
        }
        
        return webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
        // No updates needed
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: GameWebView
        
        init(_ parent: GameWebView) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            print("Game loaded successfully")
            
            // Inject JavaScript to check if canvas is working
            webView.evaluateJavaScript("""
                const canvas = document.getElementById('gameCanvas');
                const result = {
                    canvasFound: canvas !== null,
                    canvasWidth: canvas ? canvas.width : 0,
                    canvasHeight: canvas ? canvas.height : 0,
                    contextAvailable: canvas ? canvas.getContext('2d') !== null : false
                };
                JSON.stringify(result);
            """) { result, error in
                if let result = result {
                    print("Canvas check result: \(result)")
                }
                if let error = error {
                    print("JavaScript error: \(error)")
                }
            }
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            print("Failed to load game: \(error.localizedDescription)")
        }
    }
}
#else
struct GameWebView: NSViewRepresentable {
    func makeNSView(context: Context) -> WKWebView {
        let preferences = WKPreferences()
        preferences.javaScriptEnabled = true
        
        let configuration = WKWebViewConfiguration()
        configuration.preferences = preferences
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        
        // Load HTML content as string
        if let htmlPath = Bundle.main.path(forResource: "game", ofType: "html"),
           let htmlContent = try? String(contentsOfFile: htmlPath) {
            print("Loading from bundle: \(htmlPath)")
            webView.loadHTMLString(htmlContent, baseURL: Bundle.main.bundleURL)
        } else {
            // Fallback: Load from file system during development
            let projectPath = "/Users/jamesalford/Documents/Ultra Premium Tower Defense/Ultra Premium Tower Defense/game.html"
            do {
                let htmlContent = try String(contentsOfFile: projectPath)
                print("Loading from file system: \(projectPath)")
                print("HTML content length: \(htmlContent.count)")
                print("First 500 chars: \(String(htmlContent.prefix(500)))")
                webView.loadHTMLString(htmlContent, baseURL: URL(fileURLWithPath: projectPath).deletingLastPathComponent())
            } catch {
                print("Failed to load HTML: \(error)")
                webView.loadHTMLString("<h1>Error loading game</h1><p>\(error.localizedDescription)</p><p>Path: \(projectPath)</p>", baseURL: nil)
            }
        }
        
        // Enable developer extras for debugging
        webView.configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        
        return webView
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        // No updates needed
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: GameWebView
        
        init(_ parent: GameWebView) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            print("Game loaded successfully")
            
            // Inject JavaScript to check if canvas is working
            webView.evaluateJavaScript("""
                const canvas = document.getElementById('gameCanvas');
                const result = {
                    canvasFound: canvas !== null,
                    canvasWidth: canvas ? canvas.width : 0,
                    canvasHeight: canvas ? canvas.height : 0,
                    contextAvailable: canvas ? canvas.getContext('2d') !== null : false
                };
                JSON.stringify(result);
            """) { result, error in
                if let result = result {
                    print("Canvas check result: \(result)")
                }
                if let error = error {
                    print("JavaScript error: \(error)")
                }
            }
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            print("Failed to load game: \(error.localizedDescription)")
        }
    }
}
#endif

#Preview {
    ContentView()
}
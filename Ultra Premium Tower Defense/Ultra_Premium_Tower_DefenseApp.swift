//
//  Ultra_Premium_Tower_DefenseApp.swift
//  Ultra Premium Tower Defense
//
//  Created by James Alford on 8/3/25.
//

import SwiftUI

@main
struct Ultra_Premium_Tower_DefenseApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}

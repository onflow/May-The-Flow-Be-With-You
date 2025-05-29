access(all)  contract Ring {
    
    access(all)  var rings: [String]

    init() {
        self.rings = [
            "Gold Ring",
            "Silver Ring",
            "Bronze Ring",
            "Platinum Ring",
            "Titanium Ring"
        ]
    }
}
// File: Base64.cdc

access(all) contract Base64 {

    access(all) let ALPHABET: [UInt8]

    init(){
        self.ALPHABET =[
        65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
        81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101,
        102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
        115, 116, 117, 118, 119, 120, 121, 122, 48, 49, 50, 51, 52, 53,
        54, 55, 56, 57, 43, 47
    ]
    }

    access(all) fun encode(data: [UInt8]): String {
        let len = data.length
        if len == 0 {
            return ""
        }

        let encodedLen = 4 * ((len + 2) / 3)
        var encodedResult: [UInt8] = []

        var dataIndex = 0
        var resultIndex = 0

        while dataIndex < len - 2 {
            encodedResult.append(self.ALPHABET[data[dataIndex] >> 2])
            encodedResult.append(self.ALPHABET[((data[dataIndex] & 0x03) << 4) | (data[dataIndex + 1] >> 4)])
            encodedResult.append(self.ALPHABET[((data[dataIndex + 1] & 0x0F) << 2) | (data[dataIndex + 2] >> 6)])
            encodedResult.append(self.ALPHABET[data[dataIndex + 2] & 0x3F])

            dataIndex = dataIndex + 3
            resultIndex = resultIndex + 4
        }

        if dataIndex == len - 1 {
            encodedResult.append(self.ALPHABET[data[dataIndex] >> 2])
            encodedResult.append(self.ALPHABET[((data[dataIndex] & 0x03) << 4)])
            encodedResult.append(61)
            encodedResult.append(61)
        } else if dataIndex == len - 2 {
            encodedResult.append(self.ALPHABET[data[dataIndex] >> 2])
            encodedResult.append(self.ALPHABET[((data[dataIndex] & 0x03) << 4) | (data[dataIndex + 1] >> 4)])
            encodedResult.append(self.ALPHABET[((data[dataIndex + 1] & 0x0F) << 2)])
            encodedResult.append(61)
        }

        var image = String.fromUTF8(encodedResult) ?? panic("")
        return image
    }
}

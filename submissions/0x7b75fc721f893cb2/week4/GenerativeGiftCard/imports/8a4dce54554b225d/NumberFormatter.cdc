access(all) contract NumberFormatter {

    access(all) fun formatWithCommas(number: Int): String {
        let isNegative = number < 0
        let absNumber = number < 0 ? -number : number
        let numberString = absNumber.toString()
        var formatted = ""
        var count = 0

        let numberLength = numberString.length
        var i = numberLength - 1

        while i >= 0 {
            let digit = numberString.slice(from: i, upTo: i + 1)
            formatted = digit.concat(formatted)
            count = count + 1

            if count % 3 == 0 && i != 0 {
                formatted = ",".concat(formatted)
            }
            i = i - 1
        }

        if isNegative {
            formatted = "-".concat(formatted)
        }

        return formatted
    }
}

package main

import (
	"fmt"

	//if you imports this with .  you do not have to repeat overflow everywhere
	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
)

// TESTING THE EGG WISDOM SMART CONTRACT

func main() {
	o := Overflow(
		WithGlobalPrintOptions(),
		// WithNetwork("testnet"),
	)

	fmt.Println("Testing Contract")

	color.Blue("Egg Wisdom Contract testing")

	color.Green("")

	// Create a new phrase struct
	o.Tx("create_phrase",
		WithSigner("bob"),
		WithArg("phrase", "ALL THE ZEN"),
		WithArg("base64Img", "THIS IS BASE64CODE"),
		WithArg("namesOnScreen", `["Axlocity", "KittyCatRightMeow"]`),
		WithArg("catsOnScreen", `["Cat1", "Cat2"]`),
		WithArg("background", "Twilight"),
	)
	// Fetch phrases
	o.Script("get_all_phrases")
	// Mint an NFT into Bob's account
	o.Tx("mint_phrase",
		WithSigner("bob"),
		WithArg("phrase", "ALL THE ZEN"),
	)
	// Fetch Bob's owned NFTs
	o.Script("get_owned_nfts",
		WithArg("account", "bob"),
	)
}

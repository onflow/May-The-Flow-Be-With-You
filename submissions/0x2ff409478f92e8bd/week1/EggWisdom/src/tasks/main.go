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

	// Admin creates a new phrases for free
	o.Tx("admin/create_phrase",
		WithSigner("account"),
		WithArg("phrase", "ALL THE ZEN"),
		WithArg("base64Img", "THIS IS BASE64CODE"),
		WithArg("namesOnScreen", `["Axlocity", "KittyCatRightMeow"]`),
		WithArg("catsOnScreen", `["Cat1", "Cat2"]`),
		WithArg("background", "Twilight"),
	)
	// Fetch phrases
	o.Script("get_all_phrases")
	// Bob will buy a couple of Eggs
	o.Tx("buy_eggs",
		WithSigner("bob"),
		WithArg("amount", "5"),
	)
	// Bob will open a couple of Eggs
	o.Tx("open_eggs",
		WithSigner("bob"),
		WithArg("amount", "5"),
	)
	// Fetch Bob's owned NFTs
	o.Script("get_owned_nfts",
		WithArg("account", "bob"),
	)
	// Check the contract's balance
	o.Script("get_balance",
		WithArg("account", "account"),
	)
	// Bob will upload a couple of phrases
	o.Tx("create_phrase",
		WithSigner("bob"),
		WithArg("phrase", "Flow-powered and Feline-ready"),
		WithArg("base64Img", "THIS IS BASE64CODE"),
		WithArg("namesOnScreen", `["Axlocity", "KittyCatRightMeow", "Noahoverflow"]`),
		WithArg("catsOnScreen", `["Pride", "Prince", "Page"]`),
		WithArg("background", "Dawn"),
	)
	// Alice will buy a couple of Eggs
	o.Tx("buy_eggs",
		WithSigner("alice"),
		WithArg("amount", "5"),
	)
	// Alice will open a couple of Eggs
	o.Tx("open_eggs",
		WithSigner("alice"),
		WithArg("amount", "5"),
	)
	// Fetch Alice's owned NFTs
	o.Script("get_owned_nfts",
		WithArg("account", "alice"),
	)
	// Check the contract's balance
	o.Script("get_balance",
		WithArg("account", "account"),
	)
	// Check bob's balance
	o.Script("get_balance",
		WithArg("account", "bob"),
	)

}

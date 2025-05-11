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
	o.Tx("admin/create_phrase",
		WithSigner("account"),
		WithArg("phrase", "Happy Birthday!"),
		WithArg("base64Img", "THIS IS BASE64CODE"),
		WithArg("namesOnScreen", `["Axlocity", "Joolzs"]`),
		WithArg("catsOnScreen", `["Cat1", "Cat45"]`),
		WithArg("background", "Break"),
	)
	// Fetch phrases
	o.Script("get_all_phrases")
	// Bob will buy a couple of Eggs
	o.Tx("buy_eggs",
		WithSigner("bob"),
		WithArg("amount", "3"),
	)
	// Bob will open a couple of Eggs
	o.Tx("reveal_phrases",
		WithSigner("bob"),
		WithArg("amount", "3"),
	)
	// Fetch Bob's owned NFTs
	o.Script("get_owned_nfts",
		WithArg("account", "bob"),
	)
	// Check the contract's balance
	o.Script("get_balance",
		WithArg("address", "bob"),
	)
	// Bob will upload a couple of phrases
	o.Tx("create_phrase",
		WithSigner("bob"),
		WithArg("phrase", "Flow-powered and Feline-ready"),
		WithArg("base64Img", "THIS WAS BY BOB"),
		WithArg("namesOnScreen", `["Axlocity", "KittyCatRightMeow", "Noahoverflow"]`),
		WithArg("catsOnScreen", `["Pride", "Prince", "Page"]`),
		WithArg("background", "Dawn"),
	)

	// Alice will buy a couple of Eggs
	o.Tx("buy_eggs",
		WithSigner("account"),
		WithArg("amount", "5"),
	)
	// Alice will open a couple of Eggs
	o.Tx("reveal_phrases",
		WithSigner("account"),
		WithArg("amount", "5"),
	)
	// Fetch Alice's owned NFTs
	o.Script("get_owned_nfts",
		WithArg("account", "account"),
	)
	// Check the contract's balance
	o.Script("get_balance",
		WithArg("address", "account"),
	)
	// Check bob's balance
	o.Script("get_balance",
		WithArg("address", "bob"),
	)
	// Mint a wisdom egg
	o.Tx("mint_wisdom_egg",
		WithSigner("account"),
	)
	// Fetch wisdom egg
	o.Script("get_wisdom")
	// Pet the wisdom egg
	o.Tx("pet_egg",
		WithSigner("account"),
	)
	// Fetch wisdom egg
	o.Script("get_wisdom")
	// Pet the wisdom egg
	o.Tx("pet_egg",
		WithSigner("account"),
	)
	// Fetch wisdom egg
	o.Script("get_wisdom")
}

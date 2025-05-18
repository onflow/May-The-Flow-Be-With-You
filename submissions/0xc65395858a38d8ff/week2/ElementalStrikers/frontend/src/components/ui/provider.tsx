"use client"

import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"
import { useEffect } from "react"
import * as fcl from "@onflow/fcl"
import { flowConfig } from "../../../flow/config"

export function Provider(props: ColorModeProviderProps) {
  // Inicializar la configuración de FCL
  useEffect(() => {
    fcl.config(flowConfig);
  }, []);

  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}

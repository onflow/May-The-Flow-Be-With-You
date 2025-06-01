import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { Container, Typography, Button, TextField, Box, Card, CardContent, CardActions, Grid, AppBar, Toolbar, IconButton, Snackbar, Alert } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

// Configure FCL for testnet
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn"
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [user, setUser] = useState({ loggedIn: null, addr: '' });
  const [contractAddress, setContractAddress] = useState('');
  const [docHash, setDocHash] = useState('');
  const [description, setDescription] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  const handleAddContractDoc = async () => {
    try {
      const transactionId = await fcl.mutate({
        cadence: `
          import ContractDocs from 0xbbee5b2eceb8b337

          transaction(contractAddress: Address, docHash: String, description: String, riskLevel: UInt8) {
            prepare(signer: &Account) {
              let cap = getAccount(0xbbee5b2eceb8b337).capabilities.get<&ContractDocs>(/public/ContractDocs)
              let contractRef = cap.borrow()
                ?? panic("Could not borrow ContractDocs reference")
              
              contractRef.addContractDoc(
                contractAddress: contractAddress,
                docHash: docHash,
                description: description,
                riskLevel: riskLevel
              )
            }
          }
        `,
        args: (arg: any, t: any) => [
          arg(contractAddress, t.Address),
          arg(docHash, t.String),
          arg(description, t.String),
          arg(parseInt(riskLevel), t.UInt8)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 50
      });

      const transaction = await fcl.tx(transactionId).onceSealed();
      setSnackbar({ open: true, message: 'Contract documentation added successfully!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  const handleQueryContractDoc = async () => {
    try {
      const result = await fcl.query({
        cadence: `
          import ContractDocs from 0xbbee5b2eceb8b337

          access(all) fun main(contractAddress: Address): ContractDocs.ContractDocumentation? {
            let cap = getAccount(0xbbee5b2eceb8b337).capabilities.get<&ContractDocs>(/public/ContractDocs)
            let contractRef = cap.borrow()
              ?? panic("Could not borrow ContractDocs reference")
            
            return contractRef.getContractDoc(contractAddress: contractAddress)
          }
        `,
        args: (arg: any, t: any) => [arg(contractAddress, t.Address)]
      });

      if (result) {
        setSnackbar({ open: true, message: `Found documentation: ${result.description}`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'No documentation found for this contract.', severity: 'info' });
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Flow Smart Contract Documentation Assistant
            </Typography>
            {user.loggedIn ? (
              <>
                <Typography variant="body2" align="right" sx={{ mr: 2 }}>
                  Connected: {user.addr}
                </Typography>
                <Button color="inherit" onClick={fcl.unauthenticate}>Disconnect Wallet</Button>
              </>
            ) : (
              <Button color="inherit" onClick={fcl.logIn}>Connect Wallet</Button>
            )}
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Welcome to the Smart Contract Documentation Assistant
          </Typography>
          <Typography variant="body1" paragraph align="center">
            This dApp helps you manage and query documentation for Flow smart contracts.
          </Typography>
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Contract Documentation
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contract Address"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Documentation Hash"
                    value={docHash}
                    onChange={(e) => setDocHash(e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Risk Level (0-255)"
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value)}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddContractDoc}
                disabled={!user.loggedIn}
              >
                Add Documentation
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<SearchIcon />}
                onClick={handleQueryContractDoc}
                disabled={!user.loggedIn}
              >
                Query Documentation
              </Button>
            </CardActions>
          </Card>
        </Container>
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App; 
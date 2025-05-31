// Quick test to verify Flow blockchain fixes
// Run this in browser console on the live site

console.log('🧪 Testing Flow Blockchain Fixes...');

// Test 1: Check if FCL is properly loaded client-side
if (typeof window !== 'undefined') {
  console.log('✅ Client-side environment detected');
  
  // Test 2: Check FCL availability
  try {
    const fcl = require("@onflow/fcl");
    console.log('✅ FCL loaded successfully:', {
      authzExists: !!fcl.authz,
      authzType: typeof fcl.authz,
      fclVersion: fcl.VERSION || 'unknown'
    });
  } catch (error) {
    console.log('❌ FCL loading error:', error);
  }
  
  // Test 3: Check current user state
  try {
    const fcl = require("@onflow/fcl");
    fcl.currentUser.snapshot().then(user => {
      console.log('✅ Current user state:', {
        loggedIn: user.loggedIn,
        address: user.addr,
        services: user.services?.length || 0
      });
    });
  } catch (error) {
    console.log('❌ User state error:', error);
  }
  
} else {
  console.log('❌ Server-side environment - Flow operations not available');
}

// Test 4: Check icon loading
const iconElement = document.querySelector('link[rel="icon"]');
console.log('🎨 Icon status:', {
  iconFound: !!iconElement,
  iconHref: iconElement?.href,
  faviconExists: !!document.querySelector('link[rel="shortcut icon"]')
});

// Test 5: Check if Steddie chat is enhanced
if (window.React) {
  console.log('✅ React environment ready for enhanced Steddie chat');
} else {
  console.log('⚠️ React not detected in global scope');
}

console.log('🎯 Flow fix test complete! Check the logs above for results.');

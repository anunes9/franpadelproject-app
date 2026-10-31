import { createInertiaApp, router } from '@inertiajs/react'

// Back and Forward restore a page as it was when it was left, so a group
// renamed since would still show its old name. Once Inertia has restored the
// page, ask the server for its current props.
let restoringFromHistory = false
window.addEventListener('popstate', (event) => {
  restoringFromHistory = event.state?.page !== undefined
})
router.on('navigate', () => {
  if (!restoringFromHistory) return
  restoringFromHistory = false
  router.reload()
})

void createInertiaApp({
  pages: '../pages',

  strictMode: true,

  defaults: {
    form: {
      forceIndicesArrayFormatInFormData: false,
      withAllErrors: true,
    },
    visitOptions: () => {
      return { queryStringArrayFormat: 'brackets' }
    },
  },
}).catch((error) => {
  // This ensures this entrypoint is only loaded on Inertia pages
  // by checking for the presence of the root element (#app by default).
  // Feel free to remove this `catch` if you don't need it.
  if (document.getElementById('app')) {
    throw error
  } else {
    console.error(
      'Missing root element.\n\n' +
        'If you see this error, it probably means you loaded Inertia.js on non-Inertia pages.\n' +
        'Consider moving <%= vite_typescript_tag "inertia.tsx" %> to the Inertia-specific layout instead.'
    )
  }
})

import { bucket, defineRailway, github, postgres, preserve, project, ref, service, volume } from 'railway/iac'

// Railway Infrastructure as Code for the whole "FranPadelProject App" project.
// This file is the source of truth for the production environment: any service,
// database, volume, bucket, or service variable missing from it is deleted on
// `railway config apply`. Always run `railway config plan` and read the plan
// before applying. See .railway/README.md and the README's Deploy section.

const REGION = 'europe-west4-drams3a' // Railway "EU West"

export default defineRailway(() => {
  // Postgres holds the primary, cache, queue, and cable databases (config/database.yml).
  const db = postgres('Postgres', { region: REGION })
  db.deploy = { limitOverride: { containers: { cpu: 2, memoryBytes: 4_000_000_000 } } }
  db.networking = { privateNetworkEndpoint: 'postgres' }

  const dbVolume = volume('postgres-volume', {
    region: REGION,
    sizeMB: 5000,
    allowOnlineResize: true,
    alerts: { usage: { '80': {}, '95': {}, '100': {} } },
  })

  // Active Storage uploads (the `railway` service in config/storage.yml).
  // Bucket regions are immutable: changing this means creating a new bucket.
  const storage = bucket('bundled-wardrobe', { region: 'ams' })

  const app = service('franpadelproject-app', {
    source: github('anunes9/franpadelproject-app', { branch: 'main', checkSuites: false }),
    build: { buildEnvironment: 'V3', builder: 'RAILPACK' },
    replicas: { [REGION]: 1 },
    deploy: { limitOverride: { containers: { cpu: 2, memoryBytes: 4_000_000_000 } } },
    domains: ['app.franpadelproject.com'],
    // Railpack's default Rails start command only boots the server, so run
    // migrations here. A failing migration stops the deploy instead of
    // shipping code against a stale schema. railway.json at the repo root
    // sets the same command, and Railway reads it on every deploy, so
    // migrations run even if this file hasn't been applied. Keep the two
    // the same.
    preDeploy: 'bin/rails db:prepare',
    env: {
      RAILS_ENV: 'production',
      // Secret: the value stays on Railway and is never written to this file.
      RAILS_MASTER_KEY: preserve(),
      DATABASE_URL: db.env.DATABASE_URL,
      S3_ACCESS_KEY_ID: ref(storage, 'ACCESS_KEY_ID'),
      S3_SECRET_ACCESS_KEY: ref(storage, 'SECRET_ACCESS_KEY'),
      S3_BUCKET: ref(storage, 'BUCKET'),
      S3_ENDPOINT: ref(storage, 'ENDPOINT'),
      S3_REGION: ref(storage, 'REGION'),
    },
  })

  return project('FranPadelProject App', {
    resources: [db, dbVolume, storage, app],
  })
})

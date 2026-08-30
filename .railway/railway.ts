import { defineRailway, project, service } from "railway/iac";

// Last resort for a per-service CaC repo. Prefer one .railway file for the
// project and drop this if you later combine services into that file.
export const partial = "franpadelproject-app";

export default defineRailway(() => {
  const franpadelproject_app = service("franpadelproject-app", {
    start: "RAILS_ENV=production bin/rails db:prepare && RAILS_ENV=production bin/rails server",
  });
  return project("franpadelproject-app", {
    resources: [franpadelproject_app],
  });
});

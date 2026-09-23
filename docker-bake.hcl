// One `buildx bake` builds both images from the shared Dockerfile so their common stages are built
// and their cache exported once. The workflow sets TAG.
variable "IMAGE" { default = "ghcr.io/con2/larpit-fi" }
variable "TAG" { default = "dev" }

group "default" {
  targets = ["runner", "builder"]
}

target "common" {
  context    = "."
  dockerfile = "Dockerfile"
  platforms  = ["linux/amd64"]
  cache-from = ["type=registry,ref=${IMAGE}:buildcache"]
  cache-to   = ["type=registry,ref=${IMAGE}:buildcache,mode=max,image-manifest=true,oci-mediatypes=true"]
}

target "runner" {
  inherits = ["common"]
  target   = "runner"
  tags     = ["${IMAGE}:${TAG}"]
}

// Runs the migrations and the scripts in src/bin, which the standalone runner image lacks.
target "builder" {
  inherits = ["common"]
  target   = "builder"
  tags     = ["${IMAGE}:${TAG}-builder"]
}

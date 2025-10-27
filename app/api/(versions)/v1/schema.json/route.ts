import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import yaml from "yaml"

/**
 * GET /api/v1/schema.json
 *
 * Returns the OpenAPI schema for the v1 API in JSON format.
 * This is a public endpoint for API documentation and client generation.
 */
export async function GET() {
  try {
    // Read the YAML schema file
    const schemaPath = join(process.cwd(), "app/api/(versions)/v1/openapi.yaml")
    const yamlContent = await readFile(schemaPath, "utf-8")

    // Parse YAML to JSON
    const schema = yaml.parse(yamlContent)

    return NextResponse.json(schema, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error("Error reading OpenAPI schema:", error)
    return NextResponse.json(
      {
        error: "Failed to load API schema",
      },
      { status: 500 }
    )
  }
}

import { publicUrl } from "@/config";
import {
  Language,
  LarpLinkType,
  LarpType,
  Openness,
} from "@/generated/prisma/enums";
import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "larpit.fi API",
    version: "1.0.0",
  },
  servers: [{ url: publicUrl }],
  components: {
    schemas: {
      LarpType: {
        type: "string",
        enum: Object.values(LarpType),
      },
      Language: {
        type: "string",
        enum: Object.values(Language),
      },
      Openness: {
        type: "string",
        enum: Object.values(Openness),
      },
      LarpLinkType: {
        type: "string",
        enum: Object.values(LarpLinkType),
      },
      LarpLink: (() => {
        const properties = {
          href: { type: "string" },
          type: { $ref: "#/components/schemas/LarpLinkType" },
          title: { type: ["string", "null"] },
        };
        return {
          type: "object",
          required: Object.keys(properties),
          properties,
        };
      })(),
      LarpSummary: (() => {
        const properties = {
          id: { type: "string", format: "uuid" },
          alias: { type: ["string", "null"] },
          name: { type: "string" },
          type: { $ref: "#/components/schemas/LarpType" },
          language: { $ref: "#/components/schemas/Language" },
          tagline: { type: ["string", "null"] },
          openness: {
            oneOf: [
              { $ref: "#/components/schemas/Openness" },
              { type: "null" },
            ],
          },
          startsAt: { type: ["string", "null"], format: "date" },
          endsAt: { type: ["string", "null"], format: "date" },
          signupStartsAt: { type: ["string", "null"], format: "date" },
          signupEndsAt: { type: ["string", "null"], format: "date" },
          locationText: { type: ["string", "null"] },
          municipality: { type: ["string", "null"] },
          numPlayerCharacters: { type: ["integer", "null"] },
          numTotalParticipants: { type: ["integer", "null"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        };
        return {
          type: "object",
          required: Object.keys(properties),
          properties,
        };
      })(),
      LarpDetail: {
        allOf: [
          { $ref: "#/components/schemas/LarpSummary" },
          (() => {
            const properties = {
              fluffText: { type: ["string", "null"] },
              description: { type: ["string", "null"] },
              links: {
                type: "array",
                items: { $ref: "#/components/schemas/LarpLink" },
              },
            };
            return {
              type: "object",
              required: Object.keys(properties),
              properties,
            };
          })(),
        ],
      },
    },
  },
  paths: {
    "/api/larp": {
      get: {
        summary: "List larps",
        operationId: "listLarps",
        parameters: [
          {
            name: "updatedAfter",
            in: "query",
            required: false,
            description:
              "Return only larps updated after this ISO 8601 timestamp",
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description:
              "Maximum number of results to return. Omit for all results.",
            schema: { type: "integer", minimum: 1, example: 100 },
          },
          {
            name: "after",
            in: "query",
            required: false,
            description:
              "Cursor for the next page, taken from the X-Next-Cursor response header.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "List of larps",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["items", "nextCursor"],
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/LarpSummary" },
                    },
                    nextCursor: {
                      type: ["string", "null"],
                      description:
                        "Cursor for the next page. Null when limit was not specified or no more results exist.",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid query parameter",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/larp/{larpId}": {
      get: {
        summary: "Get larp by ID",
        operationId: "getLarp",
        parameters: [
          {
            name: "larpId",
            in: "path",
            required: true,
            description: "UUID of the larp",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": {
            description: "Larp detail",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LarpDetail" },
              },
            },
          },
          "404": {
            description: "Larp not found",
          },
        },
      },
    },
  },
};

export function GET() {
  return NextResponse.json(spec);
}

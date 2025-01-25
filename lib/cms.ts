import { MesoProps } from "@/lib/types"

export async function fetchGraphQL(query: string): Promise<any> {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CONTENTFUL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query }),
      next: { tags: ["destination"] },
    }
  ).then((response) => response.json())
}

export async function getMesos(): Promise<{ items: MesoProps[] }> {
  const response = await fetchGraphQL(
    `query {
        mesoCollection(where: { slug_exists: true }, order: title_ASC) {
          items {
            slug
              title
              concept
              description {
                json
              }
          }
        }
      }`
  )

  return {
    items: response.data?.mesoCollection?.items,
  }
}

export async function getMeso(slug: string): Promise<{ item: MesoProps }> {
  const response = await fetchGraphQL(
    `query {
        mesoCollection(where: { slug: "${slug}" }, limit: 1) {
          items {
            slug
            title
            concept
            description {
              json
            }
            detailsCollection {
              items {
                title
                content {
                  json
                }
              }
            }
            exercisesCollection {
              items {
                url
                title
                width
                height
              }
            }
          }
        }
      }`
  )

  return {
    item: response.data?.mesoCollection?.items[0],
  }
}

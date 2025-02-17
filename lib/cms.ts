import { AcademyProps, MesoProps, QuestionProps } from "@/lib/types"

export async function fetchGraphQL(query: string, tags: string[]): Promise<any> {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CONTENTFUL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query }),
      next: { tags },
    }
  ).then((response) => response.json())
}

export async function getAllCourses(): Promise<{ items: AcademyProps[] }> {
  const response = await fetchGraphQL(
    `query {
        academyCollection(where: { slug_exists: true }, order: level_ASC) {
          items {
            slug
            title
            level
            description {
              json
            }
            hero {
              url
            }
          }
        }
      }`,
    ['courses']
  )

  return {
    items: response.data?.academyCollection?.items,
  }
}

export async function getAllMesos(): Promise<{ items: MesoProps[] }> {
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
      }`,
    ['mesos']
  )

  return {
    items: response.data?.mesoCollection?.items,
  }
}

export async function getMesosForLevel(
  level: string
): Promise<{ items: MesoProps[] }> {
  const response = await fetchGraphQL(
    `query {
        mesoCollection(where: { level: "${level}" }, order: title_ASC) {
          items {
            slug
            title
            concept
            description {
              json
            }
          }
        }
      }`,
    ['mesos']
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
            content {
              json
            }
            exercisesCollection {
              items {
                url
                title
                width
                height
              }
            }
            videosCollection {
              items {
                url
                title
                width
                height
              }
            }
          }
        }
      }`,
    ['mesos']
  )

  return {
    item: response.data?.mesoCollection?.items[0],
  }
}

export async function getQuestions(): Promise<{ items: QuestionProps[] }> {
  const response = await fetchGraphQL(
    `query {
        questionCollection(order: number_ASC) {
          items {
            number
            question
            answers
          }
        }
      }`,
    ['questions']
  )

  return {
    items: response.data?.questionCollection?.items,
  }
}

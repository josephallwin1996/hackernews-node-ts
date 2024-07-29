import { createSchema } from "graphql-yoga"
import { type Link, Prisma } from '@prisma/client'
import type { GraphQLContext } from './context'
import { GraphQLError } from "graphql"
import { error } from "console"

const typeDefinitions = /* GraphQL */ `
  type Query {
    info: String!
    feed(filterNeedle: String): [Link!]!
    comment(id: ID!): Comment
  }

  type Link {
    id: ID!
    description: String!
    url: String!
    comments: [Comment!]!

  }

  type Comment {
    id: ID!
    body: String!
 }

  type Mutation {
    postLink(url: String!, description: String!): Link!
    postCommentOnLink(linkId: ID!, body: String!): Comment!
  }
`;

const parseIntSafe = (value: string): number | null => {
    if (/^(\d+)$/.test(value)) {
      return parseInt(value, 10)
    }
    return null
  }

const resolvers = {
    Query: {
        info: () => `This is the API of a Hackernews Clone`,
        feed(parent: unknown, args: { filterNeedle?: string }, context: GraphQLContext){
            const where = args.filterNeedle
            ?{
                OR : [
                    { description: { contains: args.filterNeedle } },
                    { url: { contains: args.filterNeedle } }
                ]
            }: {}

            return context.prisma.link.findMany({where})
        },
        async comment(parent: unknown, args: { id: string }, context: GraphQLContext) {
            return context.prisma.comment.findUnique({
                where: { id: parseInt(args.id) }
              })
        }
    },
    Mutation: {
        async postLink(
            parent: unknown, 
            args: { description: string; url: string },
            context: GraphQLContext)  {
            const newLink = await context.prisma.link.create({
                data: {
                    url: args.url,
                    description: args.description
                }
                })
            return newLink;    
        },
        async postCommentOnLink(
            parent: unknown,
            args: {linkId: string, body: string},
            context: GraphQLContext
            ){
                const linkId = parseIntSafe(args.linkId)
                if (linkId === null) {
                    return Promise.reject(
                    new GraphQLError(`Cannot post comment on non-existing link with id '${args.linkId}'.`)
                    )
                }
                const newComment = await context.prisma.comment.create({
                    data: {
                      linkId: parseInt(args.linkId),
                      body: args.body
                    }
                  })
                  .catch((err: unknown) => {
                    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
                        return Promise.reject(
                          new GraphQLError(`Cannot post comment on non-existing link with id '${args.linkId}'.`)
                        )
                      }
                      return Promise.reject(err)
                  })
                  return newComment
            }
    },
    Link: {
        id: (parent: Link) => parent.id,
        description: (parent: Link) => parent.description,
        url: (parent: Link) => parent.url,
        comments(parent: Link, args: {}, context: GraphQLContext) {
            return context.prisma.comment.findMany({
              where: {
                linkId: parent.id
              }
            })
        }
    },
  }

export const schema = createSchema({
    resolvers:[resolvers],
    typeDefs:[typeDefinitions] 
})
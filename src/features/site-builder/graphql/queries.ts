const siteFields = `
  ItemId
  CreatedDate
  LastUpdatedDate
  OrganizationIds
  Tags
  Title
  Slug
  OwnerId
  IsPublished
`;

const pageFields = `
  ItemId
  CreatedDate
  LastUpdatedDate
  OrganizationIds
  Tags
  ProjectId
  Title
  Slug
  Layout
  PageOrder
  SeoTitle
  SeoDescription
`;

export const GET_VIBE_SITES_QUERY = `
  query VibeSites($input: DynamicQueryInput) {
    getVibeProjects(input: $input) {
      totalCount
      pageNo
      pageSize
      items {
        ${siteFields}
      }
    }
  }
`;

export const GET_VIBE_PAGES_QUERY = `
  query VibePages($input: DynamicQueryInput) {
    getVibePages(input: $input) {
      totalCount
      pageNo
      pageSize
      items {
        ${pageFields}
      }
    }
  }
`;

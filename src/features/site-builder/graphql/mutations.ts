export const INSERT_VIBE_SITE_MUTATION = `
  mutation InsertVibeSite($input: VibeProjectInsertInput!) {
    insertVibeProject(input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const UPDATE_VIBE_SITE_MUTATION = `
  mutation UpdateVibeSite($filter: String!, $input: VibeProjectUpdateInput!) {
    updateVibeProject(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const DELETE_VIBE_SITE_MUTATION = `
  mutation DeleteVibeSite($filter: String!, $input: VibeProjectDeleteInput!) {
    deleteVibeProject(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const INSERT_VIBE_PAGE_MUTATION = `
  mutation InsertVibePage($input: VibePageInsertInput!) {
    insertVibePage(input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const UPDATE_VIBE_PAGE_MUTATION = `
  mutation UpdateVibePage($filter: String!, $input: VibePageUpdateInput!) {
    updateVibePage(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const DELETE_VIBE_PAGE_MUTATION = `
  mutation DeleteVibePage($filter: String!, $input: VibePageDeleteInput!) {
    deleteVibePage(filter: $filter, input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

export const INSERT_VIBE_CONTACT_SUBMISSION_MUTATION = `
  mutation InsertVibeContactSubmission($input: VibeFormSubmissionInsertInput!) {
    insertVibeFormSubmission(input: $input) {
      itemId
      totalImpactedData
      acknowledged
    }
  }
`;

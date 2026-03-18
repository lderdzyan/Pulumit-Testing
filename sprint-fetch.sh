#!/bin/bash

OWNER="${GITHUB_REPOSITORY_OWNER}"  
REPO_NAME="${GITHUB_REPOSITORY#*/}"     
PROJECT_NUMBER=${PROJECT_NUMBER}
S3_BUCKET="${S3_BUCKET}"

export GH_TOKEN="${GH_TOKEN:-$GITHUB_TOKEN}"
export OWNER REPO_NAME

gh api graphql -f query='
query($owner: String!, $number: Int!) {
  user(login: $owner) {
    projectV2(number: $number) {
      title
      items(first: 100) {
        nodes {
          content {
            ... on Issue {
              number
              title
            }
            ... on PullRequest {
              number
              title
            }
          }
          fieldValues(first: 20) {
            nodes {
              __typename

              ... on ProjectV2ItemFieldTextValue {
                text
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }

              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }

              ... on ProjectV2ItemFieldIterationValue {
                title
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }

              ... on ProjectV2ItemFieldNumberValue {
                number
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }

              ... on ProjectV2ItemFieldDateValue {
                date
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }

            }
          }
        }
      }
    }
  }
}
' -f owner="$OWNER" -F number=$PROJECT_NUMBER | jq -r '
.data.user.projectV2.items.nodes[] |
  .content.number as $num |
  (
    [.fieldValues.nodes[]
      | select(.field.name == "Sprint")
      | .name
    ][0] // "NO_SPRINT"
  ) as $sprint |
  "\($num),\($sprint)"
' > today.txt


yesterday="yesterday.txt"
today="today.txt"

while IFS=, read -r issue sprint_y; do
  sprint_t=$(grep "^$issue," "$today" | cut -d',' -f2)
  
  if [[ "$sprint_y" != NO_SPRINT* && "$sprint_t" == NO_SPRINT* ]]; then
    echo "Missing sprint for issue: $issue"
    gh issue comment "$issue" \
  --repo "$OWNER/$REPO_NAME" \
  --body "⚠️ Sprint was removed from this issue"
  fi
done < "$yesterday"




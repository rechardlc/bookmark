import type { BookmarkTreeNode } from "../../src/core/types";

export const sampleTree: BookmarkTreeNode[] = [
  {
    id: "0",
    title: "",
    children: [
      {
        id: "1",
        title: "Bookmarks Bar",
        children: [
          {
            id: "10",
            title: "MDN",
            url: "https://developer.mozilla.org/",
            dateAdded: 1000
          }
        ]
      },
      {
        id: "2",
        title: "Other Bookmarks",
        children: [
          {
            id: "20",
            title: "AI",
            children: [
              {
                id: "21",
                title: "OpenAI",
                url: "https://openai.com/",
                dateAdded: 2000
              }
            ]
          }
        ]
      }
    ]
  }
];

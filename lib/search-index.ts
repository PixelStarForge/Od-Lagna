export interface SearchIndexRecord {
  id: string;
  entryType?: "qna" | "trivia";
  title?: string;
  question: string;
  answerSnippet: string;
  answerSearchText: string;
  characters: string[];
  topics: string[];
  arc: string;
  arcName: string;
  verified: boolean;
  dateTime?: string;
}

export interface SearchIndexCharacterProfile {
  id: string;
  name: string;
  arc: string;
  japaneseName?: string;
  aliases: string[];
}

export interface SearchIndexPayload {
  records: SearchIndexRecord[];
  characters: string[];
  topics: string[];
  characterProfiles?: SearchIndexCharacterProfile[];
}

export interface SearchIndexRecord {
  id: string;
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

export interface SearchIndexPayload {
  records: SearchIndexRecord[];
  characters: string[];
  topics: string[];
}

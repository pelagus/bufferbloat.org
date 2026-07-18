import { getLearnArticle, metadataForLearnArticle } from "../../../content/articles";
import { LearnArticlePage } from "../article-pages";

const article = getLearnArticle("video-meeting-test-results");

export const metadata = metadataForLearnArticle(article);

export default function Page() {
  return <LearnArticlePage guide={article.guide} />;
}

import { getLearnArticle, metadataForLearnArticle } from "../../../content/articles";
import { LearnArticlePage } from "../article-pages";

const article = getLearnArticle("zoom-internet-test");

export const metadata = metadataForLearnArticle(article);

export default function Page() {
  return <LearnArticlePage guide={article.guide} />;
}

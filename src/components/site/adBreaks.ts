/**
 * Where the in-article ads go on a set page, and which unit each one is.
 *
 * A pure function rather than a loop inside SetPageShell, because two things
 * about it are easy to get silently wrong and neither shows up as a type error
 * or a visibly broken page:
 *
 *  1. AdSlot's "in-article" placement REQUIRES `ordinal: 0 | 1`. Two units are
 *     configured (inArticle1 and inArticle2); passing the same ordinal twice
 *     serves the same unit twice, which AdSense counts as a duplicate and only
 *     reports in its console. So the ordinal has to be assigned here, per
 *     break, and it has to be sequential.
 *  2. There is no third unit. Whatever the set length, the page gets at most
 *     two — hence MAX_IN_ARTICLE_ADS, which is a hard fact about the AdSense
 *     account, not a taste call.
 *
 * The plan's wording is "ads after every 5th question, max 2 per page".
 */

/** A break sits after every AD_EVERY-th question. */
export const AD_EVERY = 5;

/**
 * Two in-article units exist (AdSlot's SLOT_ID["in-article"] and IN_ARTICLE_2).
 * A third break would have no unit to point at.
 */
export const MAX_IN_ARTICLE_ADS = 2;

export interface AdBreak {
  /** Render the ad immediately AFTER the question at this 0-based index. */
  afterIndex: number;
  /** Which in-article unit — matches AdSlot's required `ordinal` prop. */
  ordinal: 0 | 1;
}

/**
 * The breaks for a set of `count` questions.
 *
 * A break is never emitted after the LAST question: an ad there sits below all
 * the content, where the pager, the report link and the end-of-page app card
 * already are, so it would push the page's one install CTA further down for
 * nothing. That is why the loop stops at `count - 1` rather than at `count`.
 */
export function adBreaks(count: number): AdBreak[] {
  const breaks: AdBreak[] = [];
  for (let i = AD_EVERY - 1; i < count - 1 && breaks.length < MAX_IN_ARTICLE_ADS; i += AD_EVERY) {
    breaks.push({ afterIndex: i, ordinal: breaks.length as 0 | 1 });
  }
  return breaks;
}

interface SocialMediaLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  email?: string;
  whatsapp?: string;
}

export async function findSocialMediaLinks(
  url: string,
  keyword?: string,
  location?: string
): Promise<SocialMediaLinks> {
  try {
    const existingSocial = checkExistingSocialMedia(url);
    if (existingSocial) return existingSocial;

    const socialUrls: SocialMediaLinks = {};

    // Helper function to fetch HTML content
    const fetchHtml = async (pageUrl: string): Promise<string> => {
      try {
        const response = await fetch(pageUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        return await response.text();
      } catch (error) {
        console.error(`Failed to fetch ${pageUrl}:`, error);
        return "";
      }
    };

    // Process the main URL
    const html = await fetchHtml(url);
    if (!html) return socialUrls;

    // Simple regex patterns to find social links and emails
    const patterns = {
      facebook:
        /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.com\/(?!(?:\w+\.\w+$))(?:[a-zA-Z0-9._-]+)(?:\/)?/g,
      instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/g,
      twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+/g,
      whatsapp: /(?:https?:\/\/)?(?:api\.)?(?:whatsapp\.com|wa\.me)\/[0-9]+/g,
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    };

    // Find all matches
    const facebookMatch = html.match(patterns.facebook);
    const instagramMatch = html.match(patterns.instagram);
    const twitterMatch = html.match(patterns.twitter);
    const whatsappMatch = html.match(patterns.whatsapp);
    const emailMatch = html.match(patterns.email);

    // Assign the first valid match for each
    if (facebookMatch) {
      const validBusinessFacebook = facebookMatch.find((fbUrl) => {
        const urlLower = fbUrl.toLowerCase();

        // Exclude personal profiles (firstname.lastname pattern)
        if (/facebook\.com\/\w+\.\w+\/?$/.test(urlLower)) {
          return false;
        }

        // Extract business name parts from the domain
        const domainParts = url
          .toLowerCase()
          .replace(/^https?:\/\/(www\.)?/, "")
          .split(".")[0]
          .split(/[-_]/);

        // Check if any part of the business name is in the Facebook URL
        const isBusinessPage = domainParts.some(
          (part) =>
            urlLower.includes(part) &&
            !/^\d+$/.test(urlLower.split("/").pop() || "")
        );

        return isBusinessPage;
      });

      if (validBusinessFacebook) {
        socialUrls.facebook = validBusinessFacebook;
      }
    }
    if (instagramMatch) socialUrls.instagram = instagramMatch[0];
    if (twitterMatch) socialUrls.twitter = twitterMatch[0];
    if (whatsappMatch) socialUrls.whatsapp = whatsappMatch[0];
    if (emailMatch) {
      const validEmails = emailMatch.filter(
        (email) =>
          !email.includes("example.com") &&
          !email.includes("domain.com") &&
          !email.includes("email.com")
      );
      if (validEmails.length > 0) socialUrls.email = validEmails[0];
    }

    // If no results found, try contact pages
    if (Object.keys(socialUrls).length === 0) {
      const contactUrls = generateContactPageUrls(url);
      for (const contactUrl of contactUrls) {
        const contactHtml = await fetchHtml(contactUrl);
        if (!contactHtml) continue;

        // Check for social links in contact page
        const fbMatch = contactHtml.match(patterns.facebook);
        const igMatch = contactHtml.match(patterns.instagram);
        const twMatch = contactHtml.match(patterns.twitter);
        const waMatch = contactHtml.match(patterns.whatsapp);
        const emMatch = contactHtml.match(patterns.email);

        if (fbMatch) socialUrls.facebook = fbMatch[0];
        if (igMatch) socialUrls.instagram = igMatch[0];
        if (twMatch) socialUrls.twitter = twMatch[0];
        if (waMatch) socialUrls.whatsapp = waMatch[0];
        if (emMatch) {
          const validEmails = emMatch.filter(
            (email) =>
              !email.includes("example.com") &&
              !email.includes("domain.com") &&
              !email.includes("email.com")
          );
          if (validEmails.length > 0) socialUrls.email = validEmails[0];
        }

        if (Object.keys(socialUrls).length > 0) break;
      }
    }

    return socialUrls;
  } catch (error) {
    console.error(`Error in findSocialMediaLinks for ${url}:`, error);
    return {};
  }
}

function checkExistingSocialMedia(url: string): SocialMediaLinks | null {
  if (!url) return null;

  try {
    const normalizedUrl = url.toLowerCase();
    if (
      normalizedUrl.includes("whatsapp.com") ||
      normalizedUrl.includes("wa.me")
    ) {
      return { whatsapp: url };
    }
    if (
      normalizedUrl.includes("facebook.com") ||
      normalizedUrl.includes("fb.com")
    ) {
      return { facebook: url };
    }
    if (normalizedUrl.includes("instagram.com")) {
      return { instagram: url };
    }
    if (
      normalizedUrl.includes("twitter.com") ||
      normalizedUrl.includes("x.com")
    ) {
      return { twitter: url };
    }
  } catch (error) {
    console.error("Error in checkExistingSocialMedia:", error);
  }
  return null;
}

function generateContactPageUrls(baseUrl: string): string[] {
  try {
    const url = new URL(baseUrl);
    const origin = url.origin;

    return [
      `${origin}/contact`,
      `${origin}/contato`,
      `${origin}/contact-us`,
      `${origin}/fale-conosco`,
      `${origin}/about`,
      `${origin}/about-us`,
      `${origin}/sobre`,
      `${origin}/contact.html`,
      `${origin}/contato.html`,
      `${origin}/contact.php`,
      `${origin}/contato.php`,
    ];
  } catch (error) {
    console.error("Invalid URL:", baseUrl);
    return [];
  }
}

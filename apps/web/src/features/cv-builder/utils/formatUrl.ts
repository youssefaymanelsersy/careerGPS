export function formatUrl(url: string | undefined, platform?: 'linkedin' | 'github'): string | undefined {
  if (!url) return undefined;

  let formattedUrl = url.trim();

  // If it's just a username without any slashes or dots, try to prepend platform url
  if (!formattedUrl.includes('/') && !formattedUrl.includes('.')) {
    if (platform === 'linkedin') {
      formattedUrl = `https://linkedin.com/in/${formattedUrl}`;
    } else if (platform === 'github') {
      formattedUrl = `https://github.com/${formattedUrl}`;
    }
  }

  // If it doesn't start with http/https, prepend https://
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  return formattedUrl;
}

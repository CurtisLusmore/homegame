import { styles } from '.';

export default function CssBaseline(): React.ReactElement {
  const __html = `
    body {
      background-color: ${styles.color.background};
      color: ${styles.color.text.primary};
      font-family: 'Helvetica', sans-serif;
      font-size: ${styles.fontsize.md};
      margin: 0px;
      scrollbar-gutter: stable;
    }
  `;
  return (
    <style dangerouslySetInnerHTML={{ __html }} />
  );
};

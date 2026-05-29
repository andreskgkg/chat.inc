import styles from "./page.module.css";

const previewText = "Buenos Aires, Argentina";

const fonts = [
  {
    name: "VT323",
    className: styles.vt323,
    note: "current chat font",
  },
  {
    name: "Pixelify Sans",
    className: styles.pixelifySans,
    note: "modern pixel",
  },
  {
    name: "Tiny5",
    className: styles.tiny5,
    note: "compact bitmap",
  },
  {
    name: "Jersey 10",
    className: styles.jersey10,
    note: "chunky game UI",
  },
  {
    name: "Handjet",
    className: styles.handjet,
    note: "tech pixel",
  },
  {
    name: "DotGothic16",
    className: styles.dotGothic16,
    note: "clean game text",
  },
  {
    name: "Micro 5",
    className: styles.micro5,
    note: "tiny display",
  },
  {
    name: "Jacquard 12",
    className: styles.jacquard12,
    note: "ornate pixel",
  },
  {
    name: "Press Start 2P",
    className: styles.pressStart2p,
    note: "classic arcade",
  },
  {
    name: "Silkscreen",
    className: styles.silkscreen,
    note: "blocky arcade",
  },
];

export default function FontPreviewPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/">chat.inc</a>
        <p>pixel font preview</p>
      </header>

      <section className={styles.grid} aria-label="pixel font previews">
        {fonts.map((font) => (
          <article className={styles.card} key={font.name}>
            <div className={styles.meta}>
              <h2>{font.name}</h2>
              <p>{font.note}</p>
            </div>
            <p className={`${styles.preview} ${font.className}`}>{previewText}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

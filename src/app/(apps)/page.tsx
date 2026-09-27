import PixelCloud from '@/components/ui/PixelCloudBackgroundShowcase';
import styles from '@/components/home/page.module.css';
import HeroSection from '@/components/home/HeroSection';
import Navbar from '@/components/home/Navbar';

export default function Home() {
  return (
    <main>
      <section className={styles.hero} id="top">
        <PixelCloud
          className={styles.cloudLayer}
          cloudColor="#fbf8f2"
          skyTopColor="#102f83"
          skyBottomColor="#3c8bce"
          speed={1}
          count={6}
          pixelSize={6}
        />
        <div className={styles.heroShade} aria-hidden="true" />
        <Navbar />
        <HeroSection />

        <div className={styles.sceneNote}>
          <span className={styles.liveDot} aria-hidden="true" />
          <span></span>
          <span className={styles.noteDivider} />
          <span>Discord API</span>
        </div>
      </section>

      {/* <section className={styles.details} id="features">
        <div className={styles.detailsInner}>
          <div className={styles.detailsHeading}>
            <p className={styles.detailsEyebrow}>DISCORD INTERACTIONS</p>
            <h2>Commands with a clear paper trail.</h2>
            <p>Handle incoming slash commands with verified requests, persistent logs, and report delivery to your team.</p>
          </div>
          <div className={styles.featureList}>
            <article>
              <span>01</span>
              <h3>Verify every request</h3>
              <p>Check Discord Ed25519 signatures before handling an interaction.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Log command activity</h3>
              <p>Persist `/status` and `/report` activity, responses, and processing outcomes.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Mirror reports</h3>
              <p>Forward submitted reports to a configured Discord or Slack webhook.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.details} ${styles.workflow}`} id="workflow">
        <div className={styles.detailsInner}>
          <div className={styles.detailsHeading} id="about">
            <p className={styles.detailsEyebrow}>GETTING STARTED</p>
            <h2>From command to follow-through.</h2>
            <p>Connect the Discord endpoint, register commands, then let each report land where your team works.</p>
          </div>
          <div className={styles.featureList}>
            <article>
              <span>01</span>
              <h3>Connect your endpoint</h3>
              <p>Set the interactions URL and public key in the Discord Developer Portal.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Register commands</h3>
              <p>Publish the `/status` and `/report` slash commands to your server.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Choose where reports go</h3>
              <p>Add a database and webhook URL to store and mirror report activity.</p>
            </article>
          </div>
        </div>
      </section> */}
    </main>
  );
}




import Footer from "../components/landingPage/footer";
import NavBar from "../components/landingPage/nav_bar";

export default function AboutPage() {
  return (
    <div className="h-screen w-screen bg-white overflow-x-hidden">
      <div className="py-5 px-10">
        <NavBar />
      </div>
      <div className="bg-black min-h-screen text-gray-800">
        {/* HERO */}
        <section className="relative h-105 flex items-center justify-center text-white">
          <img
            src="/images/portal.jpg"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          <div className="relative max-w-6xl mx-auto px-6">
            <h1 className="text-5xl font-semibold mb-6">
              Hodrac . . . . .<br/>Your portal to the world
            </h1>

            <p className="text-lg max-w-xl text-gray-200">
              Making travel easier, smarter, and more enjoyable for anyone who
              wants to explore the world.
            </p>
          </div>
        </section>

        {/* MAIN CARD CONTAINER */}
        <div className="bg-white relative rounded-t-[40px] -mt-20 pt-20 pb-32 px-6 z-20">
          <div className="max-w-6xl mx-auto">
            {/* PARTNER LOGOS */}
            <div className="flex justify-center gap-10 opacity-60 mb-16">
              <span>Explorer</span>
              <span>Nomad</span>
              <span>Adventure</span>
              <span>Travelers</span>
              <span>Wander</span>
            </div>

            {/* STATS */}
            <div className="grid md:grid-cols-3 gap-8 mb-24">
              <StatCard number="200+" label="Destinations explored" />
              <StatCard number="10k+" label="Travelers inspired" />
              <StatCard number="50+" label="Countries covered" />
            </div>

            {/* OUR VISION */}
            <Section
              title="Our Vision"
              text={`Hodrac is a portal to the world for travelers.
                    Our goal is simple: to make traveling easier, smarter, and more enjoyable for anyone who wants to explore the world. Travel should be exciting, not stressful. 
                    But planning trips especially with others, often involves unnecessary complications like coordinating schedules, managing shared costs, and figuring out where to go.
                    Hodrac is designed to remove those barriers and help travelers focus on what really matters: experiencing the world.`}
              image="/images/vision.jpg"
            />

            {/* WHAT HODRAC DOES */}
            <Section
              reverse
              title="What Hodrac Does"
              text={`Hodrac helps travelers discover destinations, organize the places they want to visit, and coordinate trips more easily.
                    Users can explore destinations, find valuable information about places around the world, and create wishlists of locations they want to visit.
                    These wishlists can be shared with others, allowing travelers to discover new places through their community and connect over shared travel interests.
                    As the platform evolves, Hodrac will introduce tools that simplify travel coordination, helping people plan trips together and organize their travel experiences without unnecessary stress.`}
              image="/images/discover.jpg"
            />

            {/* WHY WE STARTED */}
            <Section
              title="Why We Started Hodrac"
              text={`Hodrac was created because we understand the challenges travelers face.
                    Our founder, Chimaobi Onuoha, has a background in software engineering and experience building web and mobile platforms.
                    But the inspiration for Hodrac came from a personal place.
                    Chimaobi is what he calls a “Hodrac” — someone who loves to travel and explore the world.
                    Like many travelers, he has experienced the frustrations that come with planning trips: figuring out where to go, coordinating with others, and managing the logistics behind the scenes.
                    Hodrac was created to solve those problems and help people who love to travel do it better.`}
              image="/images/founder.jpg"
            />

            {/* VALUES */}
            <div className="mt-28">
              <h2 className="text-3xl font-semibold mb-10 text-center">
                Our Values
              </h2>

              <div className="grid md:grid-cols-3 gap-10">
                <ValueCard
                  title="Freedom to Travel"
                  text="Everyone should have the ability to explore the world and discover new places."
                />

                <ValueCard
                  title="Travel Should Be Enjoyable"
                  text="Planning and coordination should not take away from the excitement of traveling."
                />

                <ValueCard
                  title="Better Decisions Through Information"
                  text="Travelers deserve clear, useful information that helps them make better travel choices."
                />
              </div>
            </div>

            {/* MISSION */}
            <div className="text-center mt-28 max-w-3xl mx-auto">
              <h2 className="text-3xl font-semibold mb-6">Our Mission</h2>

              <p className="text-gray-600 leading-relaxed">
                We believe travel should be seamless.
                <br />
                <br />
                Hodrac is building the tools that help travelers move from the
                idea of a trip to the experience of it more easily, more
                confidently, and with less stress.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}

/* COMPONENTS */

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-gray-100 p-8 rounded-xl text-center">
      <h3 className="text-3xl font-semibold mb-2">{number}</h3>
      <p className="text-gray-500">{label}</p>
    </div>
  );
}

function Section({
  title,
  text,
  image,
  reverse,
}: {
  title: string;
  text: string;
  image: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid md:grid-cols-2 gap-16 items-center mb-28 ${
        reverse ? "md:flex-row-reverse" : ""
      }`}
    >
      <div>
        <h2 className="text-3xl font-semibold mb-6">{title}</h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
          {text}
        </p>
      </div>

      <img src={image} className="rounded-3xl h-105 w-full object-cover object-top" />
    </div>
  );
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-gray-100 p-8 rounded-xl">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{text}</p>
    </div>
  );
}

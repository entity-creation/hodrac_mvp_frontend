import { BsTwitterX, BsYoutube } from "react-icons/bs";
import { FaTiktok } from "react-icons/fa";
import { IoLogoInstagram } from "react-icons/io5";
import { TbBrandLinkedinFilled } from "react-icons/tb";
import NavBar from "../components/landingPage/nav_bar";
import Footer from "../components/landingPage/footer";

export default function ContactUsPage() {
  return (
    <div className="w-screen h-screen overflow-x-hidden">
      <div className="py-5 px-10 bg-white">
        <NavBar />
      </div>
      <div className="bg-black flex justify-center items-center h-full w-full">
        <div className="bg-white rounded-xl flex justify-center items-center w-3/4 h-2/3 text-black">
          <div id="text">
            <h2 className="pl-5">Get in touch</h2>
            <p className="label-1 pl-5">Email</p>
            <p className="pl-5">hodrac@gmail.com</p>
            <p className="label-1 pl-5">Phone</p>
            <p className="pl-5">+16472810613</p>
            <p className="label-1 pl-5">Follow Us</p>
            <div className="py-10">
              <button className="bg-inherit! hover:bg-white/20!">
                <TbBrandLinkedinFilled />
              </button>
              <button className="bg-inherit! hover:bg-white/20!">
                <BsYoutube />
              </button>
              <button className="bg-inherit! hover:bg-white/20!">
                <IoLogoInstagram />
              </button>
              <button className="bg-inherit! hover:bg-white/20!">
                <BsTwitterX />
              </button>
              <button className="bg-inherit! hover:bg-white/20!">
                <FaTiktok />
              </button>
            </div>
          </div>
          <div>
            <form action="" className="flex-col space-y-10">
              <div className="flex justify-between">
                <input
                  className="border h-8 p-2 rounded-lg"
                  type="text"
                  placeholder="Your full name"
                />
                <input
                  className="border h-8 p-2 rounded-lg"
                  type="email"
                  placeholder="Your email address"
                />
              </div>
              <textarea
                className="border w-100 h-20 rounded-2xl p-2"
                name="message"
                id="message"
              >
                Write your message
              </textarea>
              <div className="flex justify-center text-white">
                <button>Send Message</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}

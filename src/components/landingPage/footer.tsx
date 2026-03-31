import { TbBrandLinkedinFilled } from "react-icons/tb";
import { BsYoutube } from "react-icons/bs";
import { IoLogoInstagram } from "react-icons/io5";
import { BsTwitterX } from "react-icons/bs";
import { FaTiktok } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../utils/routes";

export default function Footer() {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex flex-col bg-black h-full py-30 px-40">
        <div className="flex justify-around">
          <div className="flex flex-col gap-y-50">
            <h2 className="text-2xl font-bold text-white">
            Hodrac
          </h2>

          <div className="flex flex-col gap-y-5 text-white!">
            <a href="" className="text-white! hover:text-white/50!">About</a>
            <a href="" className="text-white! hover:text-white/50!">Explore</a>
            <a href="" className="text-white! hover:text-white/50!">Popular Trips</a>
            <a href="" className="text-white! hover:text-white/50!">How it Works</a>
            <a href="" className="text-white! hover:text-white/50!" onClick={() => navigate(ROUTES.PUBLIC.CONTACTUS)}>Contact Us</a>
        </div>
          </div>

          <div className="flex w-200 h-50 bg-white text-black justify-around items-center">
            <div className=" flex flex-col w-100 gap-y-5">
                <h2 className="text-2xl font-bold">We are building this with travelers like yourself.</h2>
                <p className="text-sm font-light">Join our community and be part of the building process. Be updated on every progress we make and milestone we complete.</p>
            </div>
            <div className="w-80">
                <form action="" className="flex flex-col gap-y-10">
                    <input type="email" placeholder="Email address" className="border-none bg-black/5 p-2 rounded-xl"/>
                    <input type="submit" className="bg-black text-white rounded-xl p-2"/>
                </form>
            </div>
          </div>
        </div>

        <div className="px-13 py-10">
            <button className="bg-inherit! hover:bg-white/20!"><TbBrandLinkedinFilled/></button>
            <button className="bg-inherit! hover:bg-white/20!"><BsYoutube/></button>
            <button className="bg-inherit! hover:bg-white/20!"><IoLogoInstagram/></button>
            <button className="bg-inherit! hover:bg-white/20!"><BsTwitterX/></button>
            <button className="bg-inherit! hover:bg-white/20!"><FaTiktok/></button>
        </div>

        <div className="pl-13 text-sm text-white/50">
            <p>@2025 Hodrac. All Rights Reserved.</p>
        </div>
      </div>
    </>
  );
}

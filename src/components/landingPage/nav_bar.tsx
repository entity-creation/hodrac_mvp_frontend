import { useState } from 'react';
import { RxHamburgerMenu } from 'react-icons/rx';
import { useNavigate} from 'react-router-dom'
import { ROUTES } from '../../utils/routes';

function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
  return (
    <>
      <div className="w-full z-50">
        <div
          className="py-5 px-10 fixed top-0 right-0 flex flex-col md:hidden justify-end items-end"
          id="mobile"
        >
          <div className="text-black hover:cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
            <RxHamburgerMenu/>
          </div>
          <div className={`transition-all duration-200 ease-out transform rounded-md shadow-gray-400 shadow-md p-5 mt-5 ${menuOpen ? "flex flex-col bg-white pointer-events-auto opacity-100 translate-y-0" : "invisible pointer-events-none opacity-0 -translate-y-3"}`}>
            <div className="flex-3 text-2xl font-bold hover-sm text-gray-600 pb-3" onClick={() => navigate(ROUTES.PUBLIC.HOME)}>
              Hodrac
            </div>
            <div className="flex-1 text-gray-600 hover-sm pb-3" onClick={() => navigate(ROUTES.PUBLIC.ABOUT)}>About</div>
            <div className="flex-1 text-gray-600 hover-sm pb-3" onClick={() => navigate(ROUTES.PUBLIC.EXPLORETRIPS)}>Explore</div>
            <div className="flex-1 text-gray-600 hover-sm pb-3" onClick={() => navigate(ROUTES.PUBLIC.HOME + "#top-countries")}>Popular Trips</div>
            <div className="flex-1 text-gray-600 hover-sm pb-3" onClick={() => navigate(ROUTES.PUBLIC.HOME + "#how-it-works")}>How it Works</div>
            <div className="flex-1 text-gray-600 hover-sm pb-3" onClick={() => navigate(ROUTES.PUBLIC.CONTACTUS)}>Contact Us</div>
            <div className="flex-2"></div>
          </div>
        </div>
        <div
          className="flex space-x-15 bg-white text-black max-md:hidden"
          id="pc"
        >
          <div className="flex-3 text-2xl font-bold hover-sm text-gray-600" onClick={() => navigate(ROUTES.PUBLIC.HOME)}>
            Hodrac
          </div>
          <div className="flex-1 text-gray-600 hover-sm text-center text-[min(10vw,15px)]" onClick={() => navigate(ROUTES.PUBLIC.ABOUT)}>About</div>
          <div className="flex-1 text-gray-600 hover-sm text-center text-[min(10vw,15px)]" onClick={() => navigate(ROUTES.PUBLIC.EXPLORETRIPS)}>Explore</div>
          <div className="flex-1 text-gray-600 hover-sm text-center text-[min(10vw,15px)]" onClick={() => navigate(ROUTES.PUBLIC.HOME + "#top-countries")}>Popular Trips</div>
          <div className="flex-1 text-gray-600 hover-sm text-center text-[min(10vw,15px)]" onClick={() => navigate(ROUTES.PUBLIC.HOME + "#how-it-works")}>How it Works</div>
          <div className="flex-1 text-gray-600 hover-sm text-center text-[min(10vw,15px)]" onClick={() => navigate(ROUTES.PUBLIC.CONTACTUS)}>Contact Us</div>
          <div className="flex-2"></div>
        </div>
      </div>
    </>
  );
}

export default NavBar;

import React, { useRef, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AuthContext } from '@/modules/Common/context/AuthContext'; // Adjust path as needed
import axiosInstance from '@/modules/Common/axios/axios'; // Adjust path as needed
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBanners();
  }, [user, navigate]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/banners');
      setBanners(response.data.data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen">
      {/* Banner Section - Only show if banners exist */}
      {banners.length > 0 ? (
        <section className="relative w-full overflow-hidden">
          <div className="container mx-auto px-4">
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={0}
              slidesPerView={1}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              loop={true}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onBeforeInit={(swiper) => {
                if (swiper.params.navigation) {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                }
              }}
              className="rounded-xl shadow-lg"
            >
              {banners.map((banner, index) => (
                <SwiperSlide key={banner._id}>
                  <div className="relative">
                    <img
                      src={banner.image}
                      alt={`Banner ${index + 1}`}
                      className="w-full h-[280px] sm:h-[320px] md:h-[400px] lg:h-[520px] object-cover"
                    />
                    {/* Gradient Overlay */}
                    
                  </div>
                </SwiperSlide>
              ))}

              {/* Custom Navigation Buttons */}
              <button
                ref={prevRef}
                className="hidden lg:flex absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white text-black rounded-full p-2 shadow-md transition-all z-10"
              >
                <ArrowLeft size={24} />
              </button>
              <button
                ref={nextRef}
                className="hidden lg:flex absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white text-black rounded-full p-2 shadow-md transition-all z-10"
              >
                <ArrowRight size={24} />
              </button>
            </Swiper>
          </div>
        </section>
      ) : (
        // No banners: Show message instead of placeholders
        <section className="relative w-full overflow-hidden bg-gray-100">
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-4">No Banner Images Available</h2>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Upload your first banner image to personalize your dashboard.
            </p>
            {/* Optional: Add a link to banners upload page */}
            {/* <Button asChild className="mt-6">
              <Link to="/banners">Upload Banner</Link>
            </Button> */}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
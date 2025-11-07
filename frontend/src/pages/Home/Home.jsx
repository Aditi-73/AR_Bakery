import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button/Button';
import './Home.css';

// Import images from src/assets/images/products/
import breadImage from '../../assets/images/products/bread.jpeg';
import customCakeImage from '../../assets/images/products/custom cake.jpeg';
import pastryImage from '../../assets/images/products/pastry.jpeg';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const featuredProducts = [
    {
      id: 1,
      name: 'Artisan Bread',
      description: 'Freshly baked artisan bread with crispy crust and soft interior, perfect for any meal.',
      price: '$4.99',
      image: breadImage
    },
    {
      id: 2,
      name: 'Custom Cake',
      description: 'Beautiful custom cakes for all occasions. Birthday, wedding, or just because!',
      price: 'From $29.99',
      image: customCakeImage
    },
    {
      id: 3,
      name: 'French Pastry',
      description: 'Delicious French pastries made daily with authentic recipes and premium ingredients.',
      price: '$3.49',
      image: pastryImage
    }
  ];

  const handleOrderNow = () => {
    if (user) {
      // If logged in, show a message or navigate to products page
      alert('🎉 Welcome! Browse our products below and add them to your cart!');
    } else {
      navigate('/login');
    }
  };

  const handleProductOrder = (productName) => {
    if (user) {
      // If logged in, add to cart (for now, just show an alert)
      alert(`✅ "${productName}" added to cart!`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>
              {user ? `Welcome back, ${user.name?.split(' ')[0] || 'Friend'}!` : 'Welcome to Bakery Delight'}
            </h1>
            <p>
              {user 
                ? 'Browse our delicious products and add your favorites to the cart!' 
                : 'Fresh baked goods made with love and the finest ingredients'}
            </p>
            <Button size="large" onClick={handleOrderNow}>
              {user ? 'Browse Products' : 'Login to Order'}
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <h2>Our Featured Products</h2>
          <div className="products-grid">
            {featuredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div style="
                          height: 200px; 
                          background: linear-gradient(45deg, #8B4513, #D2691E);
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-size: 18px;
                          font-weight: bold;
                          border-radius: 8px 8px 0 0;
                        ">
                          ${product.name}
                        </div>
                      `;
                    }}
                  />
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-price">{product.price}</div>
                  <Button 
                    variant="primary" 
                    size="small" 
                    onClick={() => handleProductOrder(product.name)}
                    style={{ marginTop: '10px' }}
                  >
                    {user ? '🛒 Add to Cart' : 'Login to Order'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>Our Story</h2>
              <p>
                For over 20 years, Bakery Delight has been serving the community 
                with freshly baked goods made from traditional recipes and the 
                highest quality ingredients.
              </p>
              <p>
                Our master bakers start their day before sunrise to ensure 
                everything is fresh and ready for your morning. Every product 
                is crafted with passion and attention to detail.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
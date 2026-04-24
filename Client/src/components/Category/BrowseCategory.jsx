import { Music, Laptop, Lightbulb, Trophy, Palette, Utensils, Briefcase, HeartPulse } from 'lucide-react';
import "./BrowseCategory.css";
import CategoryCard from "./CategoryCard";
function BrowseCategory({onSelectCategory, activeCategory}) {
    const categories = [
        { name: 'Music', count: '1250', color: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', icon: <Music size={24} /> },
        { name: 'Tech', count: '890', color: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)', icon: <Laptop size={24} /> },
        { name: 'Workshops', count: '650', color: 'linear-gradient(135deg, #966209ff 0%, #f97316 100%)', icon: <Lightbulb size={24} /> },
        { name: 'Sports', count: '720', color: 'linear-gradient(135deg, #10b981 0%, #10b981 100%)', icon: <Trophy size={24} /> },
        { name: 'Arts', count: '540', color: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)', icon: <Palette size={24} /> },
        { name: 'Food', count: '430', color: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', icon: <Utensils size={24} /> },
        { name: 'Business', count: '380', color: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', icon: <Briefcase size={24} /> },
        { name: 'Wellness', count: '290', color: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)', icon: <HeartPulse size={24} /> },
    ];
    return(
        <section id='categories' className="category-section">
            <div className="section-header">
                <h2>Browse by Category</h2>
                <p>Explore a variety of categories to find the content you're interested in.</p>
            </div>
            <div className="category-grid">
                {categories.map((cat, index) =>(
                    <CategoryCard 
                        key={index} 
                        {...cat}
                        onClick={() => onSelectCategory(cat.name)} 
                        isActive = {activeCategory === cat.name}
                    />
                ))}
            </div>
        </section>
    );
}
export default BrowseCategory;
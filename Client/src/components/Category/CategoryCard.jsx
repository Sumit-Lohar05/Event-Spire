import "./CategoryCard.css";
function CategoryCard({icon, name, count, color, onClick, isActive}){
    return (
      <div className={`category-card ${isActive ? 'active' : ''}`} onClick={onClick} style={{cursor:'pointer'}}>
        <div className="category-icon" style={{ background: color }}>
          {icon}
        </div>
        <div className="category-info">
          <h3>{name}</h3><br />
          <p>{count} events</p>
        </div>
      </div>
    );
}
export default CategoryCard;
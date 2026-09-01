import { Link } from 'react-router-dom';
import './SectionCard.css';

/**
 * SectionCard — card wrapper with header, body, and optional footer.
 *
 * @param {string}   title      - card title
 * @param {string}   icon       - Material Symbols icon name
 * @param {string}   iconColor  - icon color
 * @param {string}   linkTo     - "View All" link destination
 * @param {string}   linkLabel  - "View All" text
 * @param {ReactNode} children  - card body
 * @param {ReactNode} footer    - card footer
 * @param {object}   style      - additional styles
 */
export default function SectionCard({
    title,
    icon,
    iconColor,
    linkTo,
    linkLabel = 'View All',
    children,
    footer,
    style,
}) {
    return (
        <div className="section-card" style={style}>
            <div className="section-card-hd">
                <h3>
                    {icon && (
                        <span
                            className="material-symbols-outlined"
                            style={iconColor ? { color: iconColor } : {}}
                        >
                            {icon}
                        </span>
                    )}
                    {title}
                </h3>
                {linkTo && (
                    <Link to={linkTo} className="section-card-link">
                        {linkLabel} →
                    </Link>
                )}
            </div>
            <div className="section-card-body">{children}</div>
            {footer && <div className="section-card-foot">{footer}</div>}
        </div>
    );
}
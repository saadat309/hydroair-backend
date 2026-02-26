import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Typography, 
  Badge,
  Loader
} from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

// Custom SVG Icons
const OrderIcon = () => (
  <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const SupportIcon = () => (
  <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const SubIcon = () => (
  <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const ReviewIcon = () => (
  <svg width="32px" height="32px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const ClickableCard = styled(Link)`
  text-decoration: none;
  display: block;
  flex: 1;
  min-width: 140px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-6px);
    & > div {
      box-shadow: ${({ theme }) => theme.shadows.tableHeaderShadow};
      border-color: ${({ theme, $hoverColor }) => theme.colors[$hoverColor]};
    }
  }
`;

const StyledCardContent = styled(Box)`
  background: ${({ theme }) => theme.colors.neutral0};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const IconWrapper = styled(Box)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $bgColor }) => theme.colors[$bgColor] || theme.colors.neutral100};
  color: ${({ theme, $iconColor }) => theme.colors[$iconColor] || theme.colors.neutral800};
  border-radius: 50%;
  height: 64px;
  width: 64px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -6px;
  right: -6px;
  padding: 0 4px;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: ${({ theme }) => theme.colors.danger600};
  color: #ffffff !important;
  font-weight: 800;
  border: 2px solid ${({ theme }) => theme.colors.neutral0};
  font-size: 11px;
  line-height: 1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 2;
`;

const DashboardWidget = () => {
  const [stats, setStats] = useState({ orders: 0, tickets: 0, subscriptions: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const { get } = useFetchClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await get('/api/translate/dashboard-stats');
        if (data?.data) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Flex justifyContent="center" padding={8}>
        <Loader>Loading statistics...</Loader>
      </Flex>
    );
  }

  const widgets = [
    {
      label: 'New Orders',
      count: stats.orders,
      icon: <OrderIcon />,
      to: '/content-manager/collection-types/api::order.order?page=1&pageSize=10&sort=createdAt:DESC&filters[$and][0][read][$eq]=false',
      bgColor: 'primary100',
      iconColor: 'primary600',
      hoverColor: 'primary600'
    },
    {
      label: 'New Reviews',
      count: stats.reviews,
      icon: <ReviewIcon />,
      to: '/content-manager/collection-types/api::review.review?page=1&pageSize=10&sort=createdAt:DESC&filters[$and][0][read][$eq]=false',
      bgColor: 'warning100',
      iconColor: 'warning600',
      hoverColor: 'warning600'
    },
    {
      label: 'New Support',
      count: stats.tickets,
      icon: <SupportIcon />,
      to: '/content-manager/collection-types/api::support-ticket.support-ticket?page=1&pageSize=10&sort=createdAt:DESC&filters[$and][0][read][$eq]=false',
      bgColor: 'secondary100',
      iconColor: 'secondary600',
      hoverColor: 'secondary600'
    },
    {
      label: 'New Subs',
      count: stats.subscriptions,
      icon: <SubIcon />,
      to: '/content-manager/collection-types/api::subscription-list.subscription-list?page=1&pageSize=10&sort=createdAt:DESC&filters[$and][0][read][$eq]=false',
      bgColor: 'success100',
      iconColor: 'success600',
      hoverColor: 'success600'
    }
  ];

  return (
    <Box padding={4} background="neutral0" shadow="filterShadow" hasRadius>
      <Typography variant="delta" fontWeight="bold" marginBottom={6} display="block">
        Activity Overview
      </Typography>
      
      <Flex gap={4} alignItems="stretch" wrap="wrap">
        {widgets.map((w) => (
          <ClickableCard to={w.to} key={w.label} $hoverColor={w.hoverColor}>
            <StyledCardContent>
              <IconWrapper $bgColor={w.bgColor} $iconColor={w.iconColor}>
                {w.icon}
                {w.count > 0 && (
                  <NotificationBadge>{w.count > 99 ? '99+' : w.count}</NotificationBadge>
                )}
              </IconWrapper>
              <Typography variant="pi" fontWeight="bold" textColor="neutral700">
                {w.label}
              </Typography>
            </StyledCardContent>
          </ClickableCard>
        ))}
      </Flex>
    </Box>
  );
};

export default DashboardWidget;

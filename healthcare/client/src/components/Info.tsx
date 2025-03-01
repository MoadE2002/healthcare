
import * as React from 'react';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

const products = [
    {
      name: 'Consultation Package',
      desc: 'Monthly subscription for unlimited doctor consultations',
      price: '$50.00',
    },
    {
      name: 'Priority Support',
      desc: '24/7 customer support included with premium plans',
      price: 'Free',
    },
    {
      name: 'Medical Devices',
      desc: 'Health monitoring devices required for remote consultations',
      price: '$120.00',
    },
    {
      name: 'Appointment Booking',
      desc: 'Access to our doctor appointment scheduling platform',
      price: '$25.00',
    },
  ];
  

interface InfoProps {
  totalPrice: string;
}

export default function Info({ totalPrice }: InfoProps) {
  return (
    <React.Fragment>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
        Total
      </Typography>
      <Typography variant="h4" gutterBottom>
        {totalPrice}
      </Typography>
      <List disablePadding>
        {products.map((product) => (
          <ListItem key={product.name} sx={{ py: 1, px: 0 }}>
            <ListItemText
              sx={{ mr: 2 }}
              primary={product.name}
              secondary={product.desc}
            />
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {product.price}
            </Typography>
          </ListItem>
        ))}
      </List>
    </React.Fragment>
  );
}

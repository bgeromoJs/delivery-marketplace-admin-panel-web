export type AdminSeller = {
  id: string; name: string; slug: string; owner: string; city: string;
  status: 'Ativo' | 'Pendente' | 'Suspenso'; orderCount: number; payments: string;
  legalName: string; document: string; phone: string; address: string;
  ownerEmail?: string; ownerPhone?: string; state?: string; inviteStatus?: string;
};

export type AdminCourier = {
  id: string; name: string; phone: string; vehicle: string; stores: string;
  model: string; status: string; payout: string; deliveries: number;
  cpf?: string; birthDate?: string; plate?: string; cnh?: string;
  pixKey?: string; accountHolder?: string; linkedStore?: string; perDelivery?: number;
};

export type AdminOrder = {
  id: string; store: string; customer: string; total: number; payment: string;
  status: string; courier: string; time: string; address: string; items: string[];
};

export const ADMIN_SELLERS: AdminSeller[] = [
  { id: 'pizzariadojoao', name: 'Pizzaria do João', slug: 'pizzariadojoao', owner: 'João Silva', city: 'Sorocaba', status: 'Ativo', orderCount: 1920, payments: 'Pix, Cartão, Dinheiro', legalName: 'João Silva Pizzaria Ltda.', document: '12.345.678/0001-90', phone: '(15) 3333-1200', address: 'Rua das Flores, 120, Centro' },
  { id: 'cantinadanona', name: 'Cantina da Nona', slug: 'cantinadanona', owner: 'Maria Souza', city: 'Votorantim', status: 'Pendente', orderCount: 0, payments: 'Pix, Cartão', legalName: 'Cantina da Nona Ltda.', document: '23.456.789/0001-01', phone: '(15) 3333-2200', address: 'Av. 31 de Março, 450, Centro' },
  { id: 'sushikaze', name: 'Sushi Kaze', slug: 'sushikaze', owner: 'Kenji Sato', city: 'Sorocaba', status: 'Pendente', orderCount: 0, payments: 'Pix', legalName: 'Sushi Kaze Restaurante Ltda.', document: '34.567.890/0001-12', phone: '(15) 3333-3300', address: 'Rua da Penha, 90, Centro' },
  { id: 'lanchesdoze', name: 'Lanches do Zé', slug: 'lanchesdoze', owner: 'José Lima', city: 'Itu', status: 'Ativo', orderCount: 640, payments: 'Pix, Dinheiro', legalName: 'José Lima Lanches ME', document: '45.678.901/0001-23', phone: '(11) 4022-4141', address: 'Rua Floriano Peixoto, 210, Centro' },
  { id: 'docesdavo', name: 'Doces da Vó', slug: 'docesdavo', owner: 'Ana Prado', city: 'Sorocaba', status: 'Suspenso', orderCount: 85, payments: 'Pix, Cartão', legalName: 'Ana Prado Doceria ME', document: '56.789.012/0001-34', phone: '(15) 3333-4400', address: 'Rua São Bento, 76, Centro' },
  { id: 'burgersdaprac', name: 'Burgers da Praça', slug: 'burgersdaprac', owner: 'Pedro Nunes', city: 'Votorantim', status: 'Ativo', orderCount: 384, payments: 'Pix, Cartão', legalName: 'Pedro Nunes Burgers ME', document: '67.890.123/0001-45', phone: '(15) 3333-5500', address: 'Praça de Eventos, 10' },
  { id: 'padariacentral', name: 'Padaria Central', slug: 'padariacentral', owner: 'Lúcia Martins', city: 'Itu', status: 'Ativo', orderCount: 127, payments: 'Pix, Dinheiro', legalName: 'Lúcia Martins Padaria ME', document: '78.901.234/0001-56', phone: '(11) 4022-5656', address: 'Rua Barão do Itaim, 35' },
];

export const ADMIN_COURIERS: AdminCourier[] = [
  { id: 'carlos-mendes', name: 'Carlos Mendes', phone: '+55 15 9xxxx-0001', vehicle: 'Moto', stores: 'Pizzaria do João +1', model: 'Por entrega', status: 'Em corrida', payout: 'Verificada', deliveries: 312 },
  { id: 'rafael-costa', name: 'Rafael Costa', phone: '+55 15 9xxxx-0002', vehicle: 'Bicicleta', stores: 'Lanches do Zé', model: 'Diária', status: 'Online', payout: 'Não se aplica', deliveries: 148 },
  { id: 'julia-ramos', name: 'Julia Ramos', phone: '+55 15 9xxxx-0003', vehicle: 'Moto', stores: 'Pizzaria do João, Sushi Kaze', model: 'Por entrega · Diária', status: 'Offline', payout: 'Pendente', deliveries: 96 },
  { id: 'pedro-alves', name: 'Pedro Alves', phone: '+55 15 9xxxx-0004', vehicle: 'Carro', stores: 'Sem loja vinculada', model: '—', status: 'Cadastro pendente', payout: '—', deliveries: 0 },
  { id: 'marcos-lima', name: 'Marcos Lima', phone: '+55 15 9xxxx-0005', vehicle: 'Moto', stores: 'Cantina da Nona', model: 'Por entrega', status: 'Suspenso', payout: 'Verificada', deliveries: 41 },
  { id: 'luana-silva', name: 'Luana Silva', phone: '+55 15 9xxxx-0006', vehicle: 'Bicicleta', stores: 'Pizzaria do João', model: 'Por entrega', status: 'Online', payout: 'Verificada', deliveries: 54 },
  { id: 'diego-oliveira', name: 'Diego Oliveira', phone: '+55 15 9xxxx-0007', vehicle: 'Moto', stores: 'Sem loja vinculada', model: '—', status: 'Cadastro pendente', payout: 'Pendente', deliveries: 0 },
];

export const ADMIN_ORDERS: AdminOrder[] = [
  { id: '4821', store: 'Pizzaria do João', customer: 'Cliente A', total: 98.9, payment: 'Pix', status: 'A caminho', courier: 'Carlos Mendes', time: '19:02', address: 'Rua da Penha, 120, Centro', items: ['2× Pizza Margherita — R$ 84,00', '1× Refrigerante 2L — R$ 8,90'] },
  { id: '4820', store: 'Lanches do Zé', customer: 'Cliente B', total: 42, payment: 'Dinheiro', status: 'Aguardando aceite', courier: '—', time: '19:00', address: 'Av. São Paulo, 450', items: ['1× Combo da casa — R$ 42,00'] },
  { id: '4819', store: 'Pizzaria do João', customer: 'Cliente C', total: 76.5, payment: 'Cartão online', status: 'Entregue', courier: 'Rafael Costa', time: '18:41', address: 'Rua Miranda Azevedo, 88', items: ['1× Pizza Calabresa — R$ 70,50'] },
  { id: '4818', store: 'Sushi Kaze', customer: 'Cliente D', total: 134, payment: 'Pix', status: 'Cancelado', courier: '—', time: '18:30', address: 'Rua Santa Clara, 208', items: ['1× Combinado Kaze — R$ 134,00'] },
  { id: '4817', store: 'Cantina da Nona', customer: 'Cliente E', total: 58, payment: 'Cartão na entrega', status: 'Sem entregador há 12 min', courier: '—', time: '18:22', address: 'Rua Sete de Setembro, 32', items: ['1× Nhoque da casa — R$ 58,00'] },
  { id: '4816', store: 'Lanches do Zé', customer: 'Cliente F', total: 31, payment: 'Pix', status: 'Em preparo', courier: '—', time: '18:15', address: 'Rua Padre Bento, 91', items: ['1× X-Burguer — R$ 31,00'] },
  { id: '4815', store: 'Doces da Vó', customer: 'Cliente G', total: 45, payment: 'Pix', status: 'Em preparo', courier: '—', time: '18:07', address: 'Rua Santa Rosália, 25', items: ['1× Caixa de doces — R$ 45,00'] },
];

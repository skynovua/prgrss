-- Нова мапа показує зовнішній та внутрішній широкі м’язи стегна.
update public.anatomical_muscles
set name = 'Квадрицепси (широкі м’язи)', updated_at = now()
where key = 'quadriceps';

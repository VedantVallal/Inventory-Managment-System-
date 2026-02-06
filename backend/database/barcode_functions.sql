-- ATOMIC STOCK INCREMENT FUNCTION
-- Used for barcode purchases to safely increase stock
CREATE OR REPLACE FUNCTION increment_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE (
  id UUID,
  current_stock INTEGER,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomically increment stock and return updated product
  RETURN QUERY
  UPDATE products
  SET 
    current_stock = current_stock + p_quantity,
    updated_at = NOW()
  WHERE products.id = p_product_id
  RETURNING products.id, products.current_stock, products.updated_at;
END;
$$;

-- ATOMIC STOCK DECREMENT FUNCTION
-- Used for barcode sales to safely decrease stock
-- Prevents negative stock by checking availability first
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE (
  id UUID,
  current_stock INTEGER,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if sufficient stock is available
  IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE products.id = p_product_id 
    AND current_stock >= p_quantity
  ) THEN
    RAISE EXCEPTION 'Insufficient stock available';
  END IF;

  -- Atomically decrement stock and return updated product
  RETURN QUERY
  UPDATE products
  SET 
    current_stock = current_stock - p_quantity,
    updated_at = NOW()
  WHERE products.id = p_product_id
  RETURNING products.id, products.current_stock, products.updated_at;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_product_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated;

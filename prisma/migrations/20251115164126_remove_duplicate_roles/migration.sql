with rnums as (
  select
    id,
    user_id,
    larp_id,
    role,
    row_number() over (partition by user_id, larp_id, role order by user_id, larp_id, role) as rnum
  from larpit.related_user
)
delete from larpit.related_user
where id in (select id from rnums where rnum > 1);

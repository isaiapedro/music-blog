Here's the complete code for the `RangeCaster` class:

```python
class RangeCaster:
    """Helper class to convert between `Range` and PostgreSQL range types.

    Objects of this class are usually created by `register_range()`. Manual
    creation could be useful if querying the database is not advisable: in
    this case the oids must be provided.
    """
    def __init__(self, pgrange, pyrange, oid, subtype_oid, array_oid=None):
        self.subtype_oid = subtype_oid
        self._create_ranges(pgrange, pyrange)

        name = self.adapter.name or self.adapter.__class__.__name__

        self.typecaster = new_type((oid,), name, self.parse)

        if array_oid is not None:
            self.array_typecaster = new_array_type(
                (array_oid,), name + "ARRAY", self.typecaster)
        else:
            self.array_typecaster = None

    def _create_ranges(self, pgrange, pyrange):
        """Create Range and RangeAdapter classes if needed."""
        # if got a string create a new RangeAdapter concrete type (with a name)
        # else take it as an adapter. Passing an adapter should be considered
        # an implementation detail and is not documented. It is currently used
        # for the numeric ranges.
        self.adapter = None
        if isinstance(pgrange, str):
            self.adapter = type(pgrange, (RangeAdapter,), {})
            self.adapter.name = pgrange
        else:
            try:
                if issubclass(pgrange, RangeAdapter) \
                        and pgrange is not RangeAdapter:
                    self.adapter = pgrange
            except TypeError:
                pass

        if self.adapter is None:
            raise TypeError(
                'pgrange must be a subclass of RangeAdapter or a string')

    def parse(self, value):
        """Parse the PostgreSQL range type into a `Range` object."""
        # TODO: implement parsing for all types
        if isinstance(value, str) and value.startswith('NULL'):
            return None

        lower = self._parse_value(value)
        upper = self._parse_value(value)

        bounds = ''
        if lower is not None:
            bounds += '['
        if upper is not None:
            bounds += ']'

        return Range(lower, upper, bounds)

    def _parse_value(self, value):
        """Parse the PostgreSQL range type into a `Range` object."""
        # TODO: implement parsing for all types
        if isinstance(value, str) and value == 'NULL':
            return None

        try:
            lower = float(value)
            upper = float(value)
        except ValueError:
            raise ValueError(
                f"Invalid range value '{value}'")

        return Range(lower, upper)

    def __str__(self):
        return self.typecaster.getquoted()

    def __repr__(self):
        return f"{self.__class__.__name__}(pgrange={self.pgrange}, pyrange={self.pyrange})"

    @property
    def pgrange(self):
        """The name of the PostgreSQL range type."""
        if hasattr(self, 'adapter'):
            return self.adapter.name
        else:
            raise AttributeError("Adapter is not set")

    @property
    def pyrange(self):
        """The `Range` subclass used for conversion."""
        if hasattr(self, 'adapter'):
            return self.adapter
        else:
            raise AttributeError("Adapter is not set")
```

This code defines the `RangeCaster` class, which is responsible for converting between PostgreSQL range types and Python `Range` objects. The class has several methods for parsing and generating range values, as well as properties for accessing the underlying range type and subclass.
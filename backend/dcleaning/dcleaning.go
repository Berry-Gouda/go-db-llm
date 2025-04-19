package dcleaning

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

// converts fractions to decimal
func FractionStrToDec(frac string) (float64, error) {

	splitFrac := strings.Split(frac, "/")
	if len(splitFrac) != 2 {
		err := fmt.Errorf("Failed to split Fraction expected 2 got %d", len(splitFrac))
		return 0.0, err
	}

	numerator, err := strconv.ParseFloat(splitFrac[0], 32)
	if err != nil {
		return 0.0, err
	}
	denominator, err := strconv.ParseFloat(splitFrac[1], 32)
	if err != nil {
		return 0.0, err
	}

	dec := numerator / denominator
	fmtDec := math.Round(dec*1000) / 1000

	return fmtDec, nil
}
